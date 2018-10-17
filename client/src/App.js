import React, { Component } from 'react';
import './App.css';

import { Switch, Route } from 'react-router-dom';
import Navbar from './components/navBar/NavBar';
import SignupForm from "./components/auth/SignupForm";
import Login from './components/auth/Login';
import AuthService from './components/auth/AuthService';
import Contents from './components/contents/Contents'

class App extends Component {

	constructor(props){
		super(props)
		this.state = { 
			signupInUser: null,
			loggedInUser: null 
		};
		this.service = new AuthService();
	}

	setTheUser= (userObj) => {
		this.setState({
			signupInUser: userObj,
			loggedInUser: userObj
		})
	}

	logout = () => {
		this.service.logout()
		.then(() => {
		this.setState({
			signupInUser: null,
			loggedInUser: null 
		});
		})
	}

	fetchUser(){
		if( this.state.loggedInUser === null ){
		this.service.loggedin()
		.then(response =>{
			this.setState({
				signupInUser: response,
				loggedInUser:  response
			}) 
		})
		.catch( err =>{
			this.setState({
				signupInUser: false,
				loggedInUser:  false
			}) 
		})
		}
	}

	render() {
		this.fetchUser()

		return (
			<div>
				<section className="container">
					<div className="row">
					<div className="col-12">
					<Switch>
						<Route exact path='/signup' render={() => <SignupForm setUser={this.setTheUser}/>}/>
						{/* <Route exact path='/login' render={() => <Login setUser={this.setTheUser}/>}/> */}
					</Switch>
					</div>
					</div>
				</section>
			</div>
		)
		// if (this.state.loggedInUser) {
		// 	return (
		// 		<div>
		// 		<header>
		// 			<Navbar userInSession={this.state.loggedInUser} logout={this.logout} />
		// 		</header>
		// 		</div>
		// 	);
		// } else {
		// 	return (
		// 		<div>
		// 		<header>
		// 			<Navbar userInSession={this.state.loggedInUser} logout={this.logout} />
		// 			<Switch>
		// 				<Route exact path='/signup' render={() => <Signup setUser={this.setTheUser}/>}/>
		// 				<Route exact path='/login' render={() => <Login setUser={this.getTheUser}/>}/>
		// 			</Switch>
		// 		</header>
		// 		</div>
		// 	);
		// }
	}
}

export default App;