import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Tabs = ({ tabs = ['JavaScript', 'Python'], value, onChange }) => {
  return (
    <Wrap>
      {tabs.map(t => (
        <Tab
          key={t}
          as={motion.button}
          whileHover={{ y: -4 }}
          whileTap={{ y: 0 }}
          onClick={() => onChange && onChange(t)}
          $active={t === value}
        >
          {t}
        </Tab>
      ))}
    </Wrap>
  );
};

const Wrap = styled.div`display:flex; gap:8px;`;
const Tab = styled.button`
  background: transparent; border: none; color: #d5d0ce; padding: 6px 8px; border-radius:6px; font-size:13px; cursor:pointer; letter-spacing:0.6px;
  ${p => p.$active ? `background: rgba(255,255,255,0.04); box-shadow: 0 6px 18px rgba(0,0,0,0.6); transform: translateY(-1px);` : ''}
`;

export default Tabs;
