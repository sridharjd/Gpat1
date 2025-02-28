import React, { useEffect, useState } from 'react';
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
  const [features, setFeatures] = useState([
    {
      title: 'Expert-Curated Content',
      description: 'Our questions are carefully crafted by experienced pharmacy professionals and academicians.',
      icon: <SchoolIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and performance insights.',
      icon: <TimelineIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Community Learning',
      description: 'Join a community of pharmacy students preparing for competitive exams.',
      icon: <GroupIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Smart Practice',
      description: 'Adaptive learning system that focuses on your weak areas.',
      icon: <LightbulbIcon fontSize="large" color="primary" />,
    },
  ]);

  useEffect(() => {
    try {
      // Add any initialization or data fetching logic here
    } catch (error) {
      console.error('Error in About component:', error);
    }
  }, []);

  const handleFeatureRender = (feature, index) => {
    try {
      return (
        <Grid item xs={12} md={6} key={index}>
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
      );
    } catch (error) {
      console.error(`Error rendering feature ${index}:`, error);
      return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Why Choose Us?
      </Typography>
      <Grid container spacing={2}>
        {features.map(handleFeatureRender)}
      </Grid>
    </Container>
  );
};

export default About;