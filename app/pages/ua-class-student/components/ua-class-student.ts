import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-class-student',
	templateUrl: 'ua-class-student.html',
  directives: [[ROUTER_DIRECTIVES]]
})


export class ClassStudentComponent {
  alerts: Array<Object> = [];
  classe: any;
  dateNow: Date = new Date();
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    let finishGetClass = function(data: any) {
      scope.classe = data;
      for (let i = 0; i < scope.classe.exercises.length; i++) {
        scope.classe.exercises[i].dateDue = new Date(scope.classe.exercises[i].dateEnd);
      }
      console.log(scope.classe);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(curr.getParam('id'))
    });
    this._http.post(globals.backendURL + '/restricted/class/student/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetClass(data),
        err => this._router.navigate(['/dashboard', '/home']),
        () => console.log('Got class')
      );
  }
  openExercise(exerciseID: number) {
    let scope = this;
    let finishOpenExercise = function(data: any) {
      scope._router.navigate(['/dashboard', '/in-progress', data.annotationID]);
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': this.classe.classID,
      'exerciseID': exerciseID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/student/open', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishOpenExercise(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Unable to open exercise. Possible reasons: exercise is empty or past due date',
          closable: true
        }),
        () => console.log('Opened exercise')
      );
  }
  constructor( private _router: Router, private _http: Http ) { }
}
