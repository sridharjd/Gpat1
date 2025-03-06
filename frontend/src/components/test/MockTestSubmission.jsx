import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const MockTestSubmission = ({
  open,
  onClose,
  testData,
  loading,
  onSubmit,
  timeLeft
}) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Test Submission Summary
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" gutterBottom>
              Test Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Total Questions"
                  secondary={testData?.totalQuestions || 0}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Attempted Questions"
                  secondary={testData?.attemptedQuestions || 0}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Unattempted Questions"
                  secondary={(testData?.totalQuestions || 0) - (testData?.attemptedQuestions || 0)}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Time Left"
                  secondary={formatTime(timeLeft)}
                />
              </ListItem>
            </List>
            
            <Typography variant="body1" color="textSecondary" mt={2}>
              Are you sure you want to submit the test? This action cannot be undone.
            </Typography>
          </MotionBox>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MockTestSubmission; 