import React from 'react';

const EliteAImage = ({ image, style = {}, 'data-testid': dataTestId }) => {
  return (
    <img
      style={{ width: 36, height: 36, ...style }}
      src={image?.url}
      alt="elitea"
      data-testid={dataTestId}
    />
  );
};

export default EliteAImage;
