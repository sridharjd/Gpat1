import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SchoolIcon fontSize="large" color="primary" />,
      title: 'Comprehensive Practice',
      description: 'Access thousands of GPAT and NIPER practice questions with detailed explanations'
    },
    {
      icon: <TimelineIcon fontSize="large" color="primary" />,
      title: 'Performance Tracking',
      description: 'Monitor your progress with detailed analytics and performance insights'
    },
    {
      icon: <CheckCircleIcon fontSize="large" color="primary" />,
      title: 'Mock Tests',
      description: 'Take full-length mock tests under exam-like conditions'
    },
    {
      icon: <GroupIcon fontSize="large" color="primary" />,
      title: 'Community Support',
      description: 'Join a community of pharmacy aspirants and share knowledge'
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" gutterBottom>
                Ace Your Pharmacy Entrance Exams
              </Typography>
              <Typography variant="h5" paragraph>
                Comprehensive preparation platform for GPAT, NIPER, and other pharmacy entrance exams
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{ mr: 2 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => navigate('/about')}
              >
                Learn More
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <img
                src="/assets/study.svg"
                alt="Study Illustration"
                style={{ width: '100%', maxWidth: 500 }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Why Choose Us?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                {feature.icon}
                <Typography variant="h6" sx={{ my: 2 }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Exam Information Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Popular Pharmacy Entrance Exams
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image="/assets/gpat.jpg"
                  alt="GPAT Exam"
                />
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    GPAT
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Graduate Pharmacy Aptitude Test (GPAT) is a national level entrance exam for admission to M.Pharm programs.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/exam-info/gpat')}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image="/assets/niper.jpg"
                  alt="NIPER Exam"
                />
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    NIPER
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    National Institute of Pharmaceutical Education and Research entrance exam for M.Pharm, MBA, and Ph.D programs.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/exam-info/niper')}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image="/assets/other-exams.jpg"
                  alt="Other Pharmacy Exams"
                />
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Other Exams
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Various state-level and university-specific pharmacy entrance examinations.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/exam-info/others')}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
