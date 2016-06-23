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
  constructor(private _http: Http) {}
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
    this._http.post(globals.backendURL + '/restricted/new-class', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishAddNewClass(data),
        err => console.log(err),
        () => console.log('Added new class')
      );
  }
}
