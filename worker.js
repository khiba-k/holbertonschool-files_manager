// controllers/FilesController.js
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// Create a Bull queue for file processing
const fileQueue = new Queue('fileQueue');

class FilesController {
  /**
   * Uploads a new file or creates a new folder
   * 
   * This endpoint handles the creation of three types of items:
   * 1. Folders - organizational units in the database
   * 2. Files - text or binary files stored on disk
   * 3. Images - specialized files specifically marked as images
   * 
   * Files and images are stored both in the database (metadata)
   * and on disk (content), while folders exist only in the database.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with new file data or error message
   */
  static async postUpload(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis using token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract file information from request body
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    // Validate file type
    const acceptedTypes = ['folder', 'file', 'image'];
    if (!type || !acceptedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    // Validate data for file and image types
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    // If parentId is provided, verify parent exists and is a folder
    if (parentId !== 0) {
      let parent;
      try {
        parent = await dbClient.db.collection('files').findOne({
          _id: ObjectId(parentId),
        });
      } catch (error) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Create the file document for the database
    const fileDocument = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    // If it's a folder, simply save to database
    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      // Return the new folder information
      return res.status(201).json({
        id: result.insertedId.toString(),
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    // For files and images, store the content on disk
    // Get the storage folder path
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    
    // Create the storage folder if it doesn't exist
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    } catch (error) {
      console.error(`Error creating folder: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Generate a unique filename
    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);

    // Decode and save the file
    try {
      // Decode the Base64 data
      const fileContent = Buffer.from(data, 'base64');
      // Write the file to disk
      fs.writeFileSync(localPath, fileContent);
    } catch (error) {
      console.error(`Error saving file: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Add the local path to the file document and save to database
    fileDocument.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(fileDocument);

    // For image files, add a job to the processing queue
    if (type === 'image') {
      fileQueue.add({
        userId: userId.toString(),
        fileId: result.insertedId.toString()
      });
    }

    // Return the new file information (without localPath)
    return res.status(201).json({
      id: result.insertedId.toString(),
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  /**
   * Retrieves a single file by ID
   * 
   * This endpoint returns detailed information about a specific file,
   * including its name, type, parent folder, and visibility settings.
   * Users can only access files they own or files marked as public.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with file data or error message
   */
  static async getShow(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis using token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract file ID from request parameters
    const fileId = req.params.id;
    
    // Find the file in the database
    let file;
    try {
      file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      });
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If file not found, return error
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Return the file information
    return res.status(200).json({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Lists files with pagination
   * 
   * This endpoint returns a paginated list of files for the authenticated user,
   * optionally filtered by a parent folder ID. It implements server-side
   * pagination to efficiently handle large file collections.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Array} - JSON array of file data objects or error message
   */
  static async getIndex(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis using token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract pagination and filtering parameters
    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page || 0, 10);
    
    // Calculate pagination offset (20 items per page)
    const pageSize = 20;
    const skip = page * pageSize;

    // Build the query for finding files
    const query = {
      userId: ObjectId(userId),
    };

    // Add parentId filter if it's not the root (0)
    if (parentId !== 0) {
      query.parentId = parentId;
    }

    // Fetch paginated files from the database
    const files = await dbClient.db.collection('files')
      .find(query)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    // Transform the results for the response
    const filesWithStringIds = files.map((file) => ({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    // Return the list of files
    return res.status(200).json(filesWithStringIds);
  }

  /**
   * Makes a file public
   * 
   * This endpoint updates a file's visibility to public, allowing it
   * to be accessed by users other than the owner. Only the file owner
   * can publish their files.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with updated file data or error message
   */
  static async putPublish(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis using token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract file ID from request parameters
    const fileId = req.params.id;
    
    // Find the file in the database
    let file;
    try {
      // Find the file and update its isPublic status in one operation
      file = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: ObjectId(fileId), userId: ObjectId(userId) },
        { $set: { isPublic: true } },
        { returnDocument: 'after' } // Return the updated document
      );
      
      // Extract the updated file from the result
      file = file.value;
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If file not found, return error
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Return the updated file information
    return res.status(200).json({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Makes a file private
   * 
   * This endpoint updates a file's visibility to private, restricting
   * access to only the owner. Only the file owner can unpublish their files.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with updated file data or error message
   */
  static async putUnpublish(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis using token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract file ID from request parameters
    const fileId = req.params.id;
    
    // Find the file in the database
    let file;
    try {
      // Find the file and update its isPublic status in one operation
      file = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: ObjectId(fileId), userId: ObjectId(userId) },
        { $set: { isPublic: false } },
        { returnDocument: 'after' } // Return the updated document
      );
      
      // Extract the updated file from the result
      file = file.value;
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If file not found, return error
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Return the updated file information
    return res.status(200).json({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Retrieves the content of a file
   * 
   * This endpoint returns the actual content of a file, with the appropriate MIME type.
   * It includes access control checks to ensure only public files or files owned by
   * the authenticated user are accessible. For images, it supports size parameters
   * to retrieve thumbnails.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Stream} - File content with appropriate MIME type
   */
  static async getFile(req, res) {
    // Extract file ID from request parameters
    const fileId = req.params.id;
    
    // Find the file in the database, regardless of owner
    let file;
    try {
      file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(fileId)
      });
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If file not found, return error
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check permissions - file must be public or owned by authenticated user
    if (!file.isPublic) {
      // Get token from headers
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get user ID from Redis
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if user is the owner of the file
      if (file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    // If the file is a folder, return an error
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    // Check if the file exists on disk
    if (!file.localPath || !fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Get the size query parameter (for thumbnails)
    const size = req.query.size;
    
    // Determine which file to send based on size parameter
    let filePath = file.localPath;
    
    // If size is specified and the file is an image, try to use the thumbnail
    if (size && file.type === 'image') {
      // Validate size parameter
      const allowedSizes = ['500', '250', '100'];
      if (!allowedSizes.includes(size)) {
        return res.status(400).json({ error: 'Invalid size parameter' });
      }
      
      // Construct the thumbnail path
      const thumbnailPath = `${file.localPath}_${size}`;
      
      // Check if the thumbnail exists
      if (fs.existsSync(thumbnailPath)) {
        filePath = thumbnailPath;
      } else {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    // Check if the selected file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Determine the MIME type based on the file name
    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    
    // Read and return the file content with the correct MIME type
    const fileContent = fs.readFileSync(filePath);
    res.setHeader('Content-Type', mimeType);
    return res.send(fileContent);
  }
}

export default FilesController;
