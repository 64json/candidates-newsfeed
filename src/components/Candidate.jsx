import React from 'react';

const Candidate = ({ suffix, name, party, handleChange, checked, i }) => (
  <div className="candidate-wrapper">
    <input type="checkbox" className="toggle-candidate" id={`toggle_${i}`} name={`candidate_${i}`}
           onChange={handleChange} checked={checked} />
    <label className={`candidate candidate-${suffix}`} htmlFor={`toggle_${i}`}>
      <div className="description">
        <span className="party">{party}</span>
        <span className="name">{name}</span>
      </div>
    </label>
  </div>
);

export default Candidate;