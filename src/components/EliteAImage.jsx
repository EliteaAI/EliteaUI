import React from 'react';

const EliteAImage = ({ image, style = {} }) => {
  return (
    <img
      style={{ width: 36, height: 36, ...style }}
      src={image?.url}
      alt="elitea"
    />
  );
};

export default EliteAImage;
