import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
	moduleId: module.id,
	selector: 'ua-submit',
	templateUrl: 'ua-submit.html',
  directives: [[ROUTER_DIRECTIVES, AlertComponent]]
})

export class SubmitComponent {
  alerts: Array<Object> = [];
  exerciseID: number;
  submitExercise: any;
  readyToSubmit: boolean = false;
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    this.exerciseID = parseInt(curr.getParam('id'));
    let finishGetSubmitExercise = function(data: any) {
      scope.submitExercise = data;
      console.log(data);
      if (data.missingPhenotypes.length === 0 && data.uncitedPhenotypes.length === 0
        && data.unusedRefs.length === 0) {
        scope.readyToSubmit = true;
        scope.alerts.push({
          type: 'warning',
          msg: 'You will not be able to change your responses after submitting.',
          closable: true
        });
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Please return to Annotator and address the issues below.',
          closable: true
        });
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exerciseID,
      'submit': false
    });
    this._http.post(globals.backendURL + '/restricted/exercise/student/submit', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetSubmitExercise(data),
        err => this._router.navigate(['/dashboard', '/in-progress']),
        () => console.log('Got submit exercise')
      );
  }
  constructor( private _router: Router, private _http: Http ) { }
  confirmSubmission() {
    let scope = this;
    this.readyToSubmit = false;
    this.alerts = [];
    let finishConfirmSubmission = function(data: any) {
      scope.submitExercise = data;
      if (data.success) {
        scope.alerts.push({
          type: 'success',
          msg: 'Thank you! The exercise has been submitted.',
          closable: true
        });
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Please return to Annotator and address the issues below.',
          closable: true
        });
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exerciseID,
      'submit': true
    });
    this._http.post(globals.backendURL + '/restricted/exercise/student/submit', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishConfirmSubmission(data),
        err => console.log(err),
        () => console.log('Submitted exercise')
      );
  }
  gotoAnnotator() {
    this._router.navigate(['/dashboard', '/in-progress']);
  }
  gotoAnnotation(annotationID: number) {
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
}
