import React from 'react';

const AlitaImage = ({ image, style = {} }) => {
  return (
    <img
      style={{ width: 36, height: 36, ...style }}
      src={image?.url}
      alt="alita"
    />
  );
};

export default AlitaImage;
