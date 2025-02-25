import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ExamInfo = () => {
  const navigate = useNavigate();

  const examData = {
    gpat: {
      title: 'Graduate Pharmacy Aptitude Test (GPAT)',
      description: 'GPAT is a national level entrance examination for entry into M.Pharm programs.',
      conductedBy: 'National Testing Agency (NTA)',
      eligibility: 'B.Pharm degree with minimum 55% marks',
      duration: '180 minutes',
      totalQuestions: '125 MCQs',
      importantDates: [
        'Registration: November-December',
        'Exam Date: January-February',
        'Result Declaration: March'
      ],
      examPattern: [
        'Multiple Choice Questions',
        'Negative marking of 0.25 marks',
        'Questions from B.Pharm syllabus',
        'Computer-based test mode'
      ],
      benefits: [
        'Admission to M.Pharm programs',
        'Valid for 3 years',
        'Scholarships available',
        'Accepted by all AICTE approved institutions'
      ]
    },
    niper: {
      title: 'NIPER Joint Entrance Examination',
      description: "National entrance test for admission to master's programs at National Institute of Pharmaceutical Education and Research.",
      conductedBy: 'NIPER',
      eligibility: 'B.Pharm/M.Sc with minimum 60% marks',
      duration: '120 minutes',
      totalQuestions: '100 MCQs',
      importantDates: [
        'Registration: March-April',
        'Exam Date: June',
        'Result Declaration: July'
      ],
      examPattern: [
        'Multiple Choice Questions',
        'No negative marking',
        'Subject-specific sections',
        'Computer-based test mode'
      ],
      benefits: [
        'Admission to premier NIPER institutes',
        'Research opportunities',
        'Industry connections',
        'Government scholarships'
      ]
    }
  };

  const ExamCard = ({ exam }) => (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        {exam.title}
      </Typography>
      <Typography variant="body1" paragraph>
        {exam.description}
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Conducted By" 
                    secondary={exam.conductedBy} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Eligibility" 
                    secondary={exam.eligibility} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimerIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Duration" 
                    secondary={exam.duration} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Important Dates
              </Typography>
              <List>
                {exam.importantDates.map((date, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <DateRangeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={date} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exam Pattern
              </Typography>
              <List>
                {exam.examPattern.map((pattern, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Benefits
              </Typography>
              <List>
                {exam.benefits.map((benefit, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/syllabus')}
                fullWidth
              >
                View Detailed Syllabus
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Pharmacy Entrance Exams
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        Comprehensive information about major pharmacy entrance examinations
      </Typography>
      
      <ExamCard exam={examData.gpat} />
      <ExamCard exam={examData.niper} />
    </Container>
  );
};

export default ExamInfo;
