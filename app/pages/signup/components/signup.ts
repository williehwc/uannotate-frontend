import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
	moduleId: module.id,
	selector: 'signup-cmp',
	templateUrl: 'signup.html',
	directives: [ROUTER_DIRECTIVES]
})

export class SignupComponent {
  name: string;
	email: string;
	password: string;
	confirmPassword: string;
	errorBlank: boolean;
	errorPasswordMatch: boolean;
	errorEmailTaken: boolean;
	constructor( private _router: Router, private _http: Http) {}
	gotoLogin() {
		this._router.navigate(['/']);
	}
	gotoDashboard() {
		let scope = this;
		let finishSignup = function (data: any) {
			if (!data.loginValid) {
				scope.errorEmailTaken = true;
				return;
			}
      localStorage.setItem('uaToken', data.token);
      scope._router.navigate(['/dashboard','/home']);
		};
		this.errorBlank = false;
		this.errorPasswordMatch = false;
		this.errorEmailTaken = false;
		if (!(this.name && this.email && this.password && this.confirmPassword)) {
			this.errorBlank = true;
			return;
		}
		if (this.password !== this.confirmPassword) {
			this.errorPasswordMatch = true;
			return;
		}
		let body = JSON.stringify({
			'name': this.name,
			'email': this.email.toLowerCase(),
			'password': this.password
		});
		this._http.post(globals.backendURL + '/signup', body, globals.options)
			.map(res => res.json())
			.subscribe(
				data => finishSignup(data),
				err => console.log(err),
				() => console.log('Authentication Complete')
      );
	}
}
