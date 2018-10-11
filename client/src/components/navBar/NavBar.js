import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import AuthService from '../auth/AuthService';

class Navbar extends Component {
	constructor(props) {
		super(props);
		this.state = { 
			loggedInUser: null
		};
		this.service = new AuthService();
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ ...this.state, loggedInUser: nextProps['userInSession'] });
	}

	handleLogout = e => {
		this.props.logout();
	};

	render() {
		if (this.state.loggedInUser) {
			return (
				<div>
				<NavLink exact to="/" activeClassName="selected" onClick={this.handleLogout}>Logout</NavLink>
				<h2>Welcome, {this.state.loggedInUser.username}</h2>
				</div>
			);
		} else {
			return (
				<div>
					<nav className='nav-style'>
						<ul>
							<NavLink exact to='/signup' activeClassName="selected">Signup</NavLink>
							<NavLink exact to='/login' activeClassName="selected">Login</NavLink>
						</ul>
					</nav>
				</div>
			);
		}
	}
}

export default Navbar;
