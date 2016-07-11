import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
import {DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-in-progress',
	templateUrl: 'ua-in-progress.html',
  directives: [[DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent, ROUTER_DIRECTIVES]]
})


export class InProgressComponent {
  alerts: Array<Object>;
  annotation: Object = null;
  constructor( private _router: Router, private _http: Http) {
    if (localStorage.getItem('uaAnnotation') === null) {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: 'You don\'t have any annotations open.',
        closable: true
      });
      return;
    }
    this.gotoAnnotation(localStorage.getItem('uaAnnotation'));
  }
  gotoAnnotation( annotationID: number ) {
    let scope = this;
    if (annotationID === null)
      return;
    this.alerts = [];
    localStorage.setItem('uaAnnotation', '' + annotationID);
    let initializeAnnotation = function (data:any) {
      scope.annotation = data;
      // Look up phenotype names
      // Look up citations
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/full', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => initializeAnnotation(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Invalid annotation',
          closable: true
        }),
        () => console.log('Got full annotation')
      );
  }
}
