import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import apiService from '../../../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const sendContactForm = async () => {
    try {
      await apiService.contact.submitForm(formData);
      console.log('Contact form submitted successfully.');
      setStatus({
        type: 'success',
        message: 'Thank you for your message. We will get back to you soon!',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setError('Failed to submit the contact form. Please try again later.');
      setStatus({
        type: 'error',
        message: 'There was an error sending your message. Please try again.',
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await sendContactForm();
      console.log('Contact form submitted successfully');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setError('Failed to submit the contact form. Please try again later.');
    }
  };

  const contactInfo = [
    {
      icon: <EmailIcon fontSize="large" color="primary" />,
      title: 'Email',
      content: 'support@gpatprep.com',
    },
    {
      icon: <PhoneIcon fontSize="large" color="primary" />,
      title: 'Phone',
      content: '+91 XXX XXX XXXX',
    },
    {
      icon: <LocationIcon fontSize="large" color="primary" />,
      title: 'Address',
      content: 'Mumbai, Maharashtra, India',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" paragraph>
        Have questions? We'd love to hear from you.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Box>
            {contactInfo.map((info, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {info.icon}
                    <Typography variant="h6" sx={{ ml: 2 }}>
                      {info.title}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">
                    {info.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Message"
                    name="message"
                    multiline
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                  >
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </form>

            {status.message && (
              <Alert
                severity={status.type}
                sx={{ mt: 2 }}
              >
                {status.message}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Contact;
