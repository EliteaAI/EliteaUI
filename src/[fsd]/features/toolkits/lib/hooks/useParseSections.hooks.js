import { useMemo } from 'react';

export const useParseSections = schema => {
  const { sections, sectionProps } = useMemo(() => {
    const sectionsObject = schema?.metadata?.sections || {};
    let sectionPropsArray = [];
    Object.entries(sectionsObject).forEach(([, value]) => {
      const { subsections } = value;
      subsections?.forEach(section => {
        const { fields } = section;
        sectionPropsArray = [...sectionPropsArray, ...(fields || [])];
      });
    });
    return {
      sections: sectionsObject,
      sectionProps: sectionPropsArray,
    };
  }, [schema?.metadata?.sections]);

  return { sections, sectionProps };
};
