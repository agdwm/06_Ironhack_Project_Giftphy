import axios from "axios";

class AuthService {
	constructor() {
		this.service = axios.create({
			baseURL: "http://localhost:3000/auth",
			withCredentials: true
		});
	}

	signup = (username, password, email) => {
		return this.service.post("/signup", { username, password, email })
		.then(response => response.data)
	};

	login = (email, password) => {
		return this.service.post("/login", { password, email })
		.then(response => response.data);
	};

	loggedin = () => {
		return this.service.get("/loggedin").then(response => response.data);
	};

	logout = () => {
		return this.service.get("/logout").then(response => response.data);
	};
}

export default AuthService;
