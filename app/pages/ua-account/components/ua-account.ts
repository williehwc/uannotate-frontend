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
  classes: Array<Object> = [];
  inviteCode: string;
  passwordReset: boolean = false;
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
      if (data.passwordReset) {
        scope.alerts.push({
          type: 'warning',
          msg: 'Please set a new password now.',
          closable: true
        });
        scope.passwordReset = true;
      }
    };
    let gotClasses = function (data: any) {
      scope.classes = data.classes;
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
    this._http.post(globals.backendURL + '/restricted/classes/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotClasses(data),
        err => console.log(err),
        () => console.log('Got classes')
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
        scope.passwordReset = false;
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Incorrect old password',
          closable: true
        });
      }
    };
    this.alerts = [];
    if ((!(this.password && this.newPassword && this.confirmNewPassword) && !this.passwordReset) ||
    (!(this.newPassword && this.confirmNewPassword) && this.passwordReset)) {
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
  accountUpgrade() {
    let scope = this;
    let finishUpgradeAccount = function (data:any) {
      scope.alerts.push({
        type: 'success',
        msg: 'Account upgraded; reloading app…',
        closable: true
      });
      location.reload(true);
    };
    this.alerts = [];
    if (!this.inviteCode) {
      this.alerts.push({
        type: 'danger',
        msg: 'No invite code entered',
        closable: true
      });
      return;
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'inviteCode': this.inviteCode
    });
    this._http.post(globals.backendURL + '/restricted/student/upgrade-account', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishUpgradeAccount(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Invalid invite code. It may have already been used.',
          closable: true
        }),
        () => console.log('Changed email prefs')
      );
  }
}
