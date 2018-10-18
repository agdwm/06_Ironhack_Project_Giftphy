import React from 'react';

export const FormErrors = ({ formErrors }) => (
	<div className="formErrors">
		{Object.keys(formErrors).map((fieldName, i) => {
			const field = formErrors[fieldName]
			if (!field) return '';

			return <p key={i}>{field.message || field}</p>
		})}
  	</div>
);
