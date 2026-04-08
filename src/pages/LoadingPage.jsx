import { CircularProgress, Container } from '@mui/material';

const LoadingPage = () => {
  return (
    <Container
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '50px',
        minHeight: 'calc(100vh - 191px)',
      }}
    >
      <CircularProgress />
    </Container>
  );
};
export default LoadingPage;
