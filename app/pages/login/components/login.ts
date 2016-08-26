import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
	selector : 'login-cmp',
	templateUrl : './pages/login/components/login.html',
	directives: [ROUTER_DIRECTIVES]
})

export class LoginComponent {
  email: string;
  password: string;
  errorWrongCredentials: boolean;
  errorBlank: boolean;
	constructor( private _router: Router, private _http: Http) { }
	gotoDashboard() {
    let scope = this;
    let finishLogin = function (data: any) {
      console.log(data.loginValid + '   ' + data.loginValid);
      if (!data.loginValid) {
        scope.errorWrongCredentials = true;
        return;
      }
      localStorage.setItem('uaToken', data.token);
      scope._router.navigate(['/dashboard', '/home']);
    };
    this.errorWrongCredentials = false;
    this.errorBlank = false;
    if (!(this.email && this.password)) {
      this.errorBlank = true;
      return;
    }
    let body = JSON.stringify({
      'email': this.email.toLowerCase(),
      'password': this.password
    });
    this._http.post(globals.backendURL + '/login', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishLogin(data),
        err => console.log(err),
        () => console.log('Authentication Complete')
      );
	}
	gotoSignup() {
		this._router.navigate(['/signup']);
	}
}
