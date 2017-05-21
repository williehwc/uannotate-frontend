import {Component, ViewChild} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {MODAL_DIRECTVES, BS_VIEW_PROVIDERS} from 'ng2-bootstrap/ng2-bootstrap';
import {ModalDirective} from 'ng2-bootstrap/components/modal/modal.component';
import {Http} from '@angular/http';
import {Cookie} from 'ng2-cookies/ng2-cookies';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
	selector : 'login-cmp',
	templateUrl : './pages/login/components/login.html',
	directives: [ROUTER_DIRECTIVES, MODAL_DIRECTVES],
  viewProviders: [BS_VIEW_PROVIDERS]
})

export class LoginComponent {
  email: string;
  password: string;
  errorForgotPassword: boolean;
  errorWrongCredentials: boolean;
  errorBlank: boolean;
  phenotateEmail: string = 'support-phenotate.org'.replace('-', '@');

  @ViewChild('lgModal') public lgModal:ModalDirective;

	constructor( private _router: Router, private _http: Http) { }
	routerOnActivate(curr: RouteSegment) {
  	if (curr.getParam('link')) {
      localStorage.setItem('uaShareLink', curr.getParam('link'));
      localStorage.removeItem('uaAnnotation');
      this._router.navigate(['/dashboard', '/in-progress']);
    }
  }
	gotoDashboard() {
    let scope = this;
    let finishLogin = function (data: any) {
      if (!data.loginValid) {
        scope.errorWrongCredentials = true;
        return;
      }
      localStorage.setItem('uaToken', data.token);
      localStorage.removeItem('uaAnnotation');
      localStorage.removeItem('uaCompareTo');
      localStorage.removeItem('uaShareLink');
      localStorage.removeItem('uaMyAnnotationsDisease');
      localStorage.removeItem('uaMyAnnotationsDiseaseDB');
      localStorage.removeItem('uaPhenositoryDisease');
      localStorage.removeItem('uaPhenositoryDiseaseDB');
      localStorage.removeItem('uaPhenositoryFilter');
      localStorage.removeItem('uaPhenositoryOffset');
      localStorage.removeItem('uaPhenositoryFollowing');
      Cookie.set('token', data.cookie, 30, '/', globals.domainName);
      if (data.resetKeyUsed) {
        scope._router.navigate(['/dashboard', '/account']);
      } else {
        scope._router.navigate(['/dashboard', '/home']);
      }
    };
    this.errorForgotPassword = false;
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
	forgotPassword() {
  	let scope = this;
  	let finishForgotPassword = function (data: any) {
    	scope.lgModal.show();
    };
    let errorForgotPassword = function (err: any) {
    	scope.errorForgotPassword = true;
    };
  	this.errorForgotPassword = false;
    this.errorWrongCredentials = false;
    this.errorBlank = false;
    if (this.email) {
      let body = JSON.stringify({
        'email': this.email.toLowerCase()
      });
      this._http.post(globals.backendURL + '/forgot-password', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishForgotPassword(data),
          err => errorForgotPassword(err),
          () => console.log('Forgot password')
        );
    } else {
      this.errorForgotPassword = true;
    }
	}
}
