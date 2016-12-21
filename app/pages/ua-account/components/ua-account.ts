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
  emailFollow: boolean = true;
  emailLike: boolean = true;
  showEmailPrefs: boolean = false;
  savedEmailPrefs: boolean = false;
  phenotateEmail: string = 'support-phenotate.org'.replace('-', '@');
  constructor(private _http: Http) {
    let scope = this;
    let gotLevelAndEmail = function (data: any) {
      if (data.level === 0) {
        scope.levelString = 'student';
        scope.upgradeAccount = true;
      } else {
        scope.levelString = 'professor/researcher';
        scope.upgradeAccount = false;
        if (data.emailFollow === 0)
          scope.emailFollow = false;
        if (data.emailLike === 0)
          scope.emailLike = false;
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotLevelAndEmail(data),
        err => console.log(err),
        () => console.log('Got level and email')
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
  updateEmailPrefs(emailFollow: number, emailLike: number) {
    this.showEmailPrefs = false;
    this.savedEmailPrefs = true;
    if (emailFollow === 1)
      this.emailFollow = true;
    if (emailFollow === 0)
      this.emailFollow = false;
    if (emailLike === 1)
      this.emailLike = true;
    if (emailLike === 0)
      this.emailLike = false;
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'emailFollow': emailFollow,
      'emailLike': emailLike
    });
    this._http.post(globals.backendURL + '/restricted/email-prefs', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => console.log(err),
        () => console.log('Changed email prefs')
      );
  }
}
