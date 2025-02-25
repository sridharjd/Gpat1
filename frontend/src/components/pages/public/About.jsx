import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';

const About = () => {
  const features = [
    {
      icon: <SchoolIcon fontSize="large" color="primary" />,
      title: 'Expert-Curated Content',
      description: 'Our questions are carefully crafted by experienced pharmacy professionals and academicians.'
    },
    {
      icon: <TimelineIcon fontSize="large" color="primary" />,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and performance insights.'
    },
    {
      icon: <GroupIcon fontSize="large" color="primary" />,
      title: 'Community Learning',
      description: 'Join a community of pharmacy students preparing for competitive exams.'
    },
    {
      icon: <LightbulbIcon fontSize="large" color="primary" />,
      title: 'Smart Practice',
      description: 'Adaptive learning system that focuses on your weak areas.'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" align="center" gutterBottom>
          About Us
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Empowering pharmacy students to achieve their dreams
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Our Mission
            </Typography>
            <Typography paragraph>
              We are dedicated to providing high-quality preparation resources for pharmacy entrance exams.
              Our platform is designed to help students master the concepts and achieve their goals through
              systematic practice and comprehensive learning materials.
            </Typography>
            <Typography variant="h5" gutterBottom>
              Our Vision
            </Typography>
            <Typography paragraph>
              To become the leading online platform for pharmacy entrance exam preparation,
              helping thousands of students realize their dreams of pursuing higher education
              in pharmacy.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Why Choose Us?
            </Typography>
            <Grid container spacing={2}>
              {features.map((feature, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {feature.icon}
                        <Typography variant="h6" sx={{ ml: 2 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default About;
