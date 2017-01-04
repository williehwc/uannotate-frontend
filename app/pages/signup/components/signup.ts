import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment } from '@angular/router';
import {Http} from '@angular/http';
import {Cookie} from 'ng2-cookies/ng2-cookies';
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
	errorInvalidCode: boolean;
	inviteJoinCode: string;
	constructor( private _router: Router, private _http: Http) {}
	routerOnActivate(curr: RouteSegment) {
  	if (curr.getParam('invite')) {
    	this.inviteJoinCode = curr.getParam('invite');
    }
  }
	gotoLogin() {
		this._router.navigate(['/']);
	}
	gotoDashboard() {
		let scope = this;
		let finishSignup = function (data: any) {
			if (!data.loginValid && data.invalidInviteJoinCode) {
				scope.errorInvalidCode = true;
				return;
			} else if (!data.loginValid) {
  			scope.errorEmailTaken = true;
				return;
			}
      localStorage.setItem('uaToken', data.token);
      Cookie.set('token', data.cookie, 30, '/', globals.domainName);
      scope._router.navigate(['/dashboard','/home']);
		};
		this.errorBlank = false;
		this.errorPasswordMatch = false;
		this.errorEmailTaken = false;
		this.errorInvalidCode = false;
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
			'password': this.password,
			'inviteJoinCode': this.inviteJoinCode
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
