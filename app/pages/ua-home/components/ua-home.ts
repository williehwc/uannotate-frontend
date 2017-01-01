import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-home',
	templateUrl: 'ua-home.html',
  directives: [[AlertComponent]]
})


export class HomeComponent {
  name: string;
  random: number = Math.round(Math.random() * 4);
  studentLevel: boolean = false;
  profLevel: boolean = false;
  dashboard: any;
  alerts: Array<Object> = [];
  phenotateEmail: string = 'support-phenotate.org'.replace('-', '@');
  expandJumbotron: boolean = false;
  classes: Array<any> = [];
  constructor(private _router: Router, private _http: Http) {
    let scope = this;
    if (localStorage.getItem('uaAnnotationLink') !== null) {
      let annotationID = localStorage.getItem('uaAnnotationLink');
      localStorage.removeItem('uaAnnotationLink');
      this._router.navigate(['/dashboard', '/in-progress', annotationID]);
    }
    if (localStorage.getItem('uaAnnotationShareLink') !== null) {
      // uaAnnotationShareLink is a temporary item that will help redirect the user to the
      // annotator if he is coming from a "sign up" for "log in" button from a shared annotation.
      localStorage.setItem('uaShareLink', localStorage.getItem('uaAnnotationShareLink'));
      localStorage.removeItem('uaAnnotationShareLink');
      this._router.navigate(['/dashboard', '/in-progress']);
    }
    let gotName = function (data: any) {
      scope.name = data.name.substr(0, data.name.indexOf(' '));
      if (!scope.name)
        scope.name = data.name;
    };
    let gotClasses = function (data: any) {
      scope.classes = data.classes;
    };
    let gotLevel = function (data: any) {
      if (data.level === 0) {
        scope.studentLevel = true;
        scope.profLevel = false;
      } else {
        scope.studentLevel = false;
        scope.profLevel = true;
      }
      scope.loadDashboard();
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotName(data),
        err => console.log(err),
        () => console.log('Got name')
      );
    this._http.post(globals.backendURL + '/restricted/classes/list', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotClasses(data),
        err => console.log(err),
        () => console.log('Got classes')
      );
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotLevel(data),
        err => console.log(err),
        () => console.log('Got level')
      );
  }
  loadDashboard() {
    let scope = this;
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    let finishLoadDashboard = function (data: any) {
      scope.dashboard = data;
      if (scope.profLevel && scope.dashboard.cloneAnnotations.length === 0 && scope.dashboard.exercises.length === 0)
        scope.expandJumbotron = true;
    };
    if (this.studentLevel) {
      this._http.post(globals.backendURL + '/restricted/student/dashboard', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishLoadDashboard(data),
          err => console.log(err),
          () => console.log('Got student dashboard')
        );
    } else if (this.profLevel) {
      this._http.post(globals.backendURL + '/restricted/prof/dashboard', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishLoadDashboard(data),
          err => console.log(err),
          () => console.log('Got prof dashboard')
        );
    }
  }
  openExercise(exerciseID: number, classID: number) {
    let scope = this;
    let finishOpenExercise = function(data: any) {
      scope._router.navigate(['/dashboard', '/in-progress', data.annotationID]);
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': classID,
      'exerciseID': exerciseID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/student/open', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishOpenExercise(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Unable to open exercise. Possible reasons: exercise is empty or has not started',
          closable: true
        }),
        () => console.log('Opened exercise')
      );
  }
  gotoClass(classID: number) {
    if (this.studentLevel)
      this._router.navigate(['/dashboard', '/class-student', classID]);
    if (this.profLevel)
      this._router.navigate(['/dashboard', '/class-prof', classID]);
  }
  gotoExercise(exerciseID: number) {
    this._router.navigate(['/dashboard', '/exercise', exerciseID]);
  }
  gotoAnnotation(annotationID: number) {
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
  gotoPhenository(diseaseDB: string, diseaseName: string) {
    if (diseaseName)
      localStorage.setItem('uaPhenositoryDisease', diseaseName);
    if (diseaseDB)
      localStorage.setItem('uaPhenositoryDiseaseDB', diseaseDB);
    this._router.navigate(['/dashboard', '/phenository']);
  }
  gotoJoinClass() {
    this._router.navigate(['/dashboard', '/join-class']);
  }
  gotoMyAnnotations() {
    this._router.navigate(['/dashboard', '/my-annotations']);
  }
  gotoAccount() {
    this._router.navigate(['/dashboard', '/account']);
  }
}
