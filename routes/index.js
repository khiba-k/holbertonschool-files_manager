import { Router } from 'express';
import { getStats, getStatus } from '../controllers/AppController';
import {
  disconnect,
  getConnect,
  getCurrentUser,
} from '../controllers/AuthController';
import { getIndex, getShow, postUpload } from '../controllers/FilesController';
import postNew from '../controllers/UsersController';

const router = Router();

// Get status route
router.get('/status', async (req, res) => {
  const status = await getStatus();
  res.status(200).json(status);
});

// Get stats route
router.get('/stats', async (req, res) => {
  const stats = await getStats();
  res.status(200).json(stats);
});

// Create new user route
router.post('/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for email
    if (!email) {
      console.log('Missing email');
      return res.status(400).json({ Error: 'Missing email' });
    }

    // Check for password
    if (!password) {
      console.log('Missing password');
      return res.status(400).json({ Error: 'Missing password' });
    }

    // Post New User
    const postedUser = await postNew(email, password);

    if (postedUser == false) {
      console.log('Email already exists');
      return res.status(400).json({ Error: 'Already Exists' });
    }
    console.log('User created successfully');
    return res.status(201).json(postedUser);
  } catch (error) {
    console.log('An error occured when posting user: ', error);
  }
});

// Get connect route
router.get('/connect', async (req, res) => {
  try {
    // Get email and password key:value pair
    const { authorization } = req.headers;

    if (authorization) {
      const emailPassPair = authorization.split(' ')[1];

      const isUserConnected = await getConnect(emailPassPair);
      if (isUserConnected == false) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ token: isUserConnected });
    }
    console.log('authorization Header is missing or incorrect.');
  } catch (error) {
    console.log('An error occured while logging in: ', error);
  }
});

// Disconnect route
router.get('/disconnect', async (req, res) => {
  try {
    const token = req.headers['x-token'];

    if (token) {
      const deleteSession = await disconnect(token);

      if (deleteSession) {
        return res.status(204).send('');
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.log('Error disconnecting: ', error);
  }
});

// Get user route
router.get('/users/me', async (req, res) => {
  try {
    const token = req.headers['x-token'];

    if (token) {
      const user = await getCurrentUser(token);

      if (user == false) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { email, _id } = user;
      const userObj = { id: _id, email };
      res.json(userObj);
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.log('Error getting current user details: ', error);
  }
});

// Post new file route
router.post('/files', async (req, res) => {
  try {
    const token = req.headers['x-token'];
    const {
      name, type, parentId, data, isPublic,
    } = req.body;

    // Check existence of token
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Check existence of name
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    // Check existence of file type
    if (!type || (type == 'folder' && type == 'file' && type == 'image')) {
      return res.status(400).json({ error: 'Missing type' });
    }
    // Check existence of data
    if (!data && type != 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Try saving file
    const uploadData = await postUpload(
      token,
      name,
      type,
      parentId,
      data,
      isPublic,
    );

    // If saving file fails
    if (uploadData.success == false) {
      if (uploadData.message == 'User not found') {
        return res.status(401).json({ error: 'Unauthorized' });
      } if (uploadData.message == 'Parent file not found') {
        return res.status(400).json({ error: 'Parent not found' });
      } if (uploadData.message == 'Parent is not folder') {
        return res.status(400).json({ error: 'Parent is not folder' });
      } if (uploadData.message == 'User does not have access to file') {
        return res
          .status(401)
          .json({ error: 'User does not have access to file' });
      } if (uploadData.message == 'Error creating storage directory') {
        return res.status(401).json({ error: 'Error creating directory' });
      }
    }

    if (uploadData.success) {
      return res.status(201).json(uploadData.data);
    }
  } catch (error) {
    console.log('Error posting file', error);
    return res.status(500).send('A server side error occured');
  }
});

// Get file by id route
router.get('/files/:id', async (req, res) => {
  try {
    const token = req.headers['x-token'];
    const { id } = req.params;

    // Check existence of token
    if (!token) {
      return res.status(400).json({ error: 'Missing authorization token' });
    }

    // Get files
    const file = await getShow(token, id);

    // If failed to get files
    if (!file.success) {
      if (file.message == 'User not authorized') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (file.message == 'File not found') {
        return res.status(404).json({ error: 'Not found' });
      }
    } else {
      return res.status(201).json(file.data);
    }
  } catch (error) {
    console.log('An error occured while getting file', error);
    return res
      .status(500)
      .json({ success: false, message: 'A server side error occured' });
  }
});

// Get files route
router.get('/files', async (req, res) => {
  try {
    const token = req.headers['x-token'];
    const { parentId } = req.query;
    const { page } = req.query;

    // Check existence of token
    if (!token) {
      return res
        .status(400)
        .json({ error: 'Request is missing authorization token' });
    }

    // Get files
    const files = await getIndex(token, parentId, page);

    // If files not retrieved
    if (!files.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json(files.data);
  } catch (error) {
    console.log('An error occured while fetching files');
    return res
      .status(500)
      .json({ success: false, message: 'A server side error occured' });
  }
});

export default router;
