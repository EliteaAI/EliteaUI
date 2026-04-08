import { Container } from '@mui/material';

import { MISSING_ENVS } from '@/common/constants';

export const contentPageStyle = { minHeight: 'calc(100vh - 141px)' };

const EnvMissingPage = () => {
  return (
    <Container
      style={{
        ...contentPageStyle,
        marginTop: '50px',
        minHeight: 'calc(100vh - 191px)',
      }}
    >
      <p style={{ color: 'red' }}>[Error]</p>
      <p> System env missing: </p>
      <ul>
        {MISSING_ENVS.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Container>
  );
};
export default EnvMissingPage;
