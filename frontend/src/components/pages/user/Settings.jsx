import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: false,
    showProgress: true,
    autoSaveAnswers: true
  });

  const handleToggle = async (setting) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const newValue = !settings[setting];
      
      // Update setting in backend
      await api.put('/users/settings', {
        setting,
        value: newValue
      });

      // Update local state
      setSettings(prev => ({
        ...prev,
        [setting]: newValue
      }));

      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <List>
          <ListItem>
            <ListItemText 
              primary="Email Notifications"
              secondary="Receive email notifications about test results and updates"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                disabled={loading}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Dark Mode"
              secondary="Switch between light and dark theme"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
                disabled={loading}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Show Progress"
              secondary="Display your progress in the dashboard"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.showProgress}
                onChange={() => handleToggle('showProgress')}
                disabled={loading}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Auto-save Answers"
              secondary="Automatically save your answers during tests"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.autoSaveAnswers}
                onChange={() => handleToggle('autoSaveAnswers')}
                disabled={loading}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Settings;
