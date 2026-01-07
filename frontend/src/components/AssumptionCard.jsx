import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const AssumptionCard = ({ text }) => {
  return (
    <MotionWrap whileHover={{ y: -6 }} whileTap={{ y: 0 }}>
      <Card>
        <p>{text}</p>
      </Card>
    </MotionWrap>
  );
};

const MotionWrap = styled(motion.div)`display:block;`;
const Card = styled.div`
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  padding: 12px 14px; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.6);
  color: #dfe7e7; font-size:13px; margin-bottom:12px; min-width: 220px;
`;

export default AssumptionCard;
