import {Component, ViewEncapsulation} from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';
import {CORE_DIRECTIVES} from '@angular/common';
import {DROPDOWN_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';
import {Router} from '@angular/router';
import {Http} from '@angular/http';
import {Cookie} from 'ng2-cookies/ng2-cookies';
import globals = require('../../globals');
import 'rxjs/Rx';

@Component({
    moduleId: module.id,
    selector: 'top-nav',
    templateUrl: 'topnav.html',
    encapsulation: ViewEncapsulation.None,
    directives: [DROPDOWN_DIRECTIVES, CORE_DIRECTIVES, ROUTER_DIRECTIVES]
})

export class TopNavComponent {
  name: string;
	public oneAtATime:boolean = true;
	public items: Array<any> = [{name:'google',link: 'https://google.com'},{name:'facebook',link: 'https://facebook.com'}];
	public status:Object = {
	    isFirstOpen: true,
	    isFirstDisabled: false
	};
	constructor(private _router: Router, private _http: Http) {
    // Get name; redirect to Login if failed
    let scope = this;
    let gotName = function (data: any) {
      scope.name = data.name;
    };
    let invalidUser = function () {
      if (localStorage.getItem('uaAnnotation') !== null) {
        localStorage.setItem('uaAnnotationLink', localStorage.getItem('uaAnnotation'));
      }
      if (localStorage.getItem('uaShareLink') === null) {
        scope.logOut();
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotName(data),
        err => invalidUser(),
        () => console.log('Got name')
      );
  }
  logOut() {
    Cookie.set('token', '', -1, '/', globals.domainName);
    localStorage.removeItem('uaToken');
    this._router.navigate(['/']);
  }
	gotoLogin() {
    let scope = this;
    let finishLogout = function (data: any) {
      scope.logOut();
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/logout', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishLogout(data),
        err => console.log(err),
        () => console.log('Deauthentication Complete')
      );
	}
}
