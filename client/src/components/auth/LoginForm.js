// auth/Login.js
import React, { Component } from "react";
import { Link } from "react-router-dom";
import AuthService from "./AuthService";
import {Button, ControlLabel, FormControl, FormGroup} from "react-bootstrap";
import {FormErrors} from './AuthFormErrors';

class SignupLogin extends Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			email: '',
			password: '',
			emailValid: false,
			passwordValid: false,
			formErrors: {email: '', password: '', error: ''},
			formValid: false
		};
		this.service = new AuthService();
	}
  
	handleFormSubmit = e => {
		e.preventDefault();
		const {email, password, formErrors} = this.state;

		this.setState({formErrors: {...formErrors, error: undefined}})

		this.service.login(email, password)
			.then(response => {
				this.setState({
					email: '',
					password: ''
				});

				this.props.setUser({message: response.message, response: response.user});
			})
			.catch(err => {
				let error = err.response.data.message;
				this.setState({formErrors: {...formErrors, error}})
			});
	};

	handleChange (e) {
		const name = e.target.name;
		const value = e.target.value;
		this.setState({
			[name]: value
		}, () => { this.validateField(name, value) });
	}

	validateField(fieldName, value) {
		let fieldValidationErrors = this.state.formErrors;
		let emailValid = this.state.emailValid;
		let passwordValid = this.state.passwordValid;

		switch(fieldName) {
			case 'email':
				emailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
				fieldValidationErrors.email = emailValid ? '' : 'Email is invalid';
				break;
			case 'password':
				passwordValid = value.length >= 6;
				fieldValidationErrors.password = passwordValid ? '': 'Password is too short';
				break;
			default:
				break;
		}

		this.setState({
			formErrors: fieldValidationErrors,
			emailValid: emailValid,
			passwordValid: passwordValid
		}, this.validateForm);
	}
	  
	validateForm() {
		this.setState({formValid: this.state.emailValid && this.state.passwordValid});
	}
  
	errorClass(error) {
		return(error.length === 0 ? 'has-success' : 'has-error');
	}
  
	render() {
		return (
			<section className="auth-form">
				<header>
					<h2 className="auth-form-title title">Welcome to Giftphy!</h2>
				</header>
				<form onSubmit={e => this.handleFormSubmit(e)}>

					<FormGroup controlId="email" className={`form-group ${this.errorClass(this.state.formErrors.email)}`}>
						<ControlLabel bsClass="auth-label">Email:</ControlLabel>
						<FormControl bsSize="large" type="email" name="email" value={this.state.email} placeholder="Email" onChange={ e => this.handleChange(e)}/>
						<FormControl.Feedback />
					</FormGroup>

					<FormGroup controlId="password" className={`form-group ${this.errorClass(this.state.formErrors.password)}`}>
						<ControlLabel bsClass="auth-label">Password:</ControlLabel>
						<FormControl bsSize="large" type="password" name="password" value={this.state.password} placeholder="Password" onChange={ e => this.handleChange(e)}/>
						<FormControl.Feedback />
					</FormGroup>

					<div className="auth-form-errors">
						<FormErrors formErrors={this.state.formErrors} />
					</div>

					<div className="auth-form-footer">
						<Button bsClass="btn btn-lg btn-block brand-btn" bsSize="large" block type="submit" disabled={!this.state.formValid}>Log In</Button>
					</div>

					<div className="auth-form-link">
						<p>
							<Link className="brand-link" to="/signup">Create a new account</Link>
						</p>
					</div>
				</form>
			</section>
		);
	}
}
  
//render(<AuthForm />);
export default SignupLogin;
