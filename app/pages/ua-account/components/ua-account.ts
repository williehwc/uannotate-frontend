import {Component} from '@angular/core';
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-account',
	templateUrl: 'ua-account.html',
  directives: [[AlertComponent]]
})


export class AccountComponent {
  levelString: string;
  upgradeAccount: boolean = false;
  password: string;
  newPassword: string;
  confirmNewPassword: string;
  alerts: Array<Object> = [];
  phenotateEmail: string = 'support-phenotate.org'.replace('-', '@');
  constructor(private _http: Http) {
    let scope = this;
    let gotLevel = function (data: any) {
      console.log(data.level);
      if (data.level === 0) {
        scope.levelString = 'student';
        scope.upgradeAccount = true;
      } else {
        scope.levelString = 'professor/researcher';
        scope.upgradeAccount = false;
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotLevel(data),
        err => console.log(err),
        () => console.log('Got level')
      );
  }
  closeAlert(i: number) {
    this.alerts.splice(i, 1);
  }
  changePassword() {
    let scope = this;
    let finishChangePassword = function (data: any) {
      if (data.passwordValid) {
        scope.password = '';
        scope.newPassword = '';
        scope.confirmNewPassword = '';
        scope.alerts.push({
          type: 'success',
          msg: 'Password changed',
          closable: true
        });
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Incorrect old password',
          closable: true
        });
      }
    };
    this.alerts = [];
    if (!(this.password && this.newPassword && this.confirmNewPassword)) {
      scope.alerts.push({
        type: 'danger',
        msg: 'All fields are required',
        closable: true
      });
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      scope.alerts.push({
        type: 'danger',
        msg: 'Passwords don\'t match',
        closable: true
      });
      return;
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'password': this.password,
      'newPassword': this.newPassword
    });
    this._http.post(globals.backendURL + '/restricted/change-password', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishChangePassword(data),
        err => console.log(err),
        () => console.log('Changed password')
      );
  }
}
