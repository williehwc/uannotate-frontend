import {Component} from '@angular/core';
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-join-class',
	templateUrl: 'ua-join-class.html',
  directives: [[AlertComponent]]
})


export class JoinClassComponent {
  joinCode: number;
  alerts: Array<Object> = [];
  constructor(private _http: Http) {}
  joinClass() {
    let scope = this;
    let joinCodeHolder = this.joinCode;
    let finishJoinClass = function (data:any) {
      if (!data.notFound && !data.alreadyJoined) {
        scope.alerts.push({
          type: 'success',
          msg: 'Joined class; reloading app…',
          closable: true
        });
        location.reload(true);
      } else if (data.notFound) {
        scope.alerts.push({
          type: 'danger',
          msg: 'Invalid join code',
          closable: true
        });
        scope.joinCode = joinCodeHolder;
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'You\'ve already joined this class',
          closable: true
        });
      }
    };
    this.alerts = [];
    if (!(this.joinCode)) {
      scope.alerts.push({
        type: 'danger',
        msg: 'All fields are required',
        closable: true
      });
      return;
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'joinCode': this.joinCode
    });
    this.joinCode = null;
    this._http.post(globals.backendURL + '/restricted/classes/student/join', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishJoinClass(data),
        err => console.log(err),
        () => console.log('Joined class')
      );
  }
}
