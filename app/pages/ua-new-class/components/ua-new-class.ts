import {Component} from '@angular/core';
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-new-class',
	templateUrl: 'ua-new-class.html',
  directives: [[AlertComponent]]
})


export class NewClassComponent {
  name: string;
  alerts: Array<Object> = [];
  constructor(private _http: Http) {
    let scope = this;
    let gotClasses = function (data: any) {
      if (data.classes.length > 0) {
        scope.alerts.push({
          type: 'info',
          msg: 'The last class you added is ' + data.classes[0].name + '. ' +
          'Students can join it using this join code: ' + data.classes[0].joinCode,
          closable: true
        });
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/classes/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotClasses(data),
        err => console.log(err),
        () => console.log('Got classes')
      );
  }
  addNewClass() {
    let scope = this;
    let finishAddNewClass = function (data: any) {
      scope.alerts.push({
        type: 'success',
        msg: 'Class added; reloading app…',
        closable: true
      });
      location.reload(true);
    };
    this.alerts = [];
    if (!(this.name)) {
      scope.alerts.push({
        type: 'danger',
        msg: 'All fields are required',
        closable: true
      });
      return;
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'name': this.name
    });
    this.name = '';
    this._http.post(globals.backendURL + '/restricted/prof/new-class', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishAddNewClass(data),
        err => console.log(err),
        () => console.log('Added new class')
      );
  }
}
