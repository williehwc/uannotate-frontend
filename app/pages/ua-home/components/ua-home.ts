import {Component, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {AlertComponent, MODAL_DIRECTVES, BS_VIEW_PROVIDERS} from 'ng2-bootstrap/ng2-bootstrap';
import {ModalDirective} from 'ng2-bootstrap/components/modal/modal.component';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';
declare var jQuery: any;

@Component({
  moduleId: module.id,
	selector: 'ua-home',
	templateUrl: 'ua-home.html',
  directives: [[AlertComponent, MODAL_DIRECTVES]],
  viewProviders: [BS_VIEW_PROVIDERS]
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
  newAnnotationDisease: string;
  newAnnotationDiseaseDB: string = 'ordo';
  typeAheadBox: string;
  nOfOne: boolean = false;
  classID: number = -1;
  newNickname: string;
  superscript: string;
  leaderboardSecondPage: boolean = false;
  nicknameList: string = '';
  rankOfNicknameList: number = 0;

  welcomeMessage: string = null;
  costInPhenocashToPrefillAnnotation: number;
  rewardInPointsForCustomAnnotation: number;
  rewardInPhenocashForCustomAnnotation: number;
  canPrefill: boolean = false;

  @ViewChild('lgModal') public lgModal:ModalDirective;
  @ViewChild('smModal') public smModal:ModalDirective;

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
      'token': localStorage.getItem('uaToken'),
      'classID': this.classID
    });
    let finishLoadDashboardStudent = function (data: any) {
      scope.dashboard = data;
      console.log(data);
      if (scope.studentLevel) {
        jQuery('.js-typeahead').typeahead({
          dynamic: true,
          cancelButton: false,
          filter: false,
          source: {
            diseases: {
              ajax: {
                url: globals.backendURL + '/solr/ordo-no-count/{{query}}',
                path: 'matches'
              }
            }
          },
          callback: {
            onClickAfter: function (node: any, a: any, item: any, event: any) {
              scope.prepareToAnnotate(scope.newAnnotationDiseaseDB, item.display);
            }
          }
        });
        jQuery('.js-typeahead-omim').typeahead({
          dynamic: true,
          cancelButton: false,
          filter: false,
          source: {
            diseases: {
              ajax: {
                url: globals.backendURL + '/solr/omim-no-count/{{query}}',
                path: 'matches'
              }
            }
          },
          callback: {
            onClickAfter: function (node: any, a: any, item: any, event: any) {
              scope.prepareToAnnotate(scope.newAnnotationDiseaseDB, item.display);
            }
          }
        });
        if (localStorage.getItem('uaMyAnnotationsDiseaseDB') !== null) {
          scope.newAnnotationDiseaseDB = localStorage.getItem('uaMyAnnotationsDiseaseDB');
          scope.setDB(scope.newAnnotationDiseaseDB);
        }
      }
      if (data.ranking % 10 === 1 && data.ranking !== 11) {
        scope.superscript = 'st';
      } else if (data.ranking % 10 === 2 && data.ranking !== 12) {
        scope.superscript = 'nd';
      } else if (data.ranking % 10 === 3 && data.ranking !== 13) {
        scope.superscript = 'rd';
      } else {
        scope.superscript = 'th';
      }
    };
    let finishLoadDashboardProf = function (data: any) {
      scope.dashboard = data;
      if (scope.dashboard.cloneAnnotations.length === 0 && scope.dashboard.exercises.length === 0)
        scope.expandJumbotron = true;
    };
    if (this.studentLevel) {
      this._http.post(globals.backendURL + '/restricted/student/dashboard', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishLoadDashboardStudent(data),
          err => console.log(err),
          () => console.log('Got student dashboard')
        );
    } else if (this.profLevel) {
      this._http.post(globals.backendURL + '/restricted/prof/dashboard', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishLoadDashboardProf(data),
          err => console.log(err),
          () => console.log('Got prof dashboard')
        );
    }
  }
  setDB(db:string) {
    this.newAnnotationDiseaseDB = db;
    localStorage.setItem('uaMyAnnotationsDiseaseDB', this.newAnnotationDiseaseDB);
    if (this.newAnnotationDiseaseDB === 'ordo') {
      jQuery('#omim-form').hide();
      jQuery('#ordo-form').show();
    }
    if (this.newAnnotationDiseaseDB === 'omim') {
      jQuery('#omim-form').show();
      jQuery('#ordo-form').hide();
    }
  }
  prepareToAnnotate(diseaseDB: string, diseaseName: string) {
    let scope = this;
    this.newAnnotationDisease = diseaseName;
    scope.setDB(diseaseDB);
    localStorage.setItem('uaMyAnnotationsDiseaseDB', this.newAnnotationDiseaseDB);
    let finishPrecheck = function (data:any) {
      scope.costInPhenocashToPrefillAnnotation = data.costInPhenocashToPrefillAnnotation;
      scope.canPrefill = (data.prefillAvailable && !data.ongoingExercise);
      scope.lgModal.show();
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'diseaseName': diseaseName.substr(0, this.newAnnotationDisease.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': diseaseDB
    });
    this._http.post(globals.backendURL + '/restricted/annotations/new-annotation-precheck', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishPrecheck(data),
        err => console.log(err),
        () => console.log('Created annotation')
      );
  }
  createAnnotation(startFromScratch: boolean) {
    let scope = this;
    this.alerts = [];
    let diseaseName = this.newAnnotationDisease;
    let finishCreateAnnotation = function (data:any) {
      if (data.success) {
        scope._router.navigate(['/dashboard', '/in-progress', data.annotationID]);
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Can\'t create annotation. Possible reasons: invalid disesase',
          closable: true
        });
        scope.newAnnotationDisease = diseaseName;
      }
    };
    if (this.newAnnotationDisease !== null) {
      this.lgModal.hide();
      this.newAnnotationDisease = '';
      // Create new annotation
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'diseaseName': diseaseName,
        'vocabulary': this.newAnnotationDiseaseDB,
        'startFromScratch': startFromScratch,
        'nOfOne': this.nOfOne,
        'classID': this.classID
      });
      this._http.post(globals.backendURL + '/restricted/annotations/student/new-annotation', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishCreateAnnotation(data),
          err => this.alerts.push({
            type: 'danger',
            msg: 'Can\'t create annotation. Possible reasons: no more annotation slots, ' +
              'already working on an annotation of this disease, or reached annotation limit for this disease',
            closable: true
          }),
          () => console.log('Created annotation')
        );
    }
  }
  setNickname() {
    let scope = this;
    this.alerts = [];
    let finishSetNickname = function (data:any) {
      scope.loadDashboard();
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'nickname': this.newNickname
    });
    this._http.post(globals.backendURL + '/restricted/student/nickname', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetNickname(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Please try another nickname.',
          closable: true
        }),
        () => console.log('Nickname set')
      );
  }
  showNicknameList(rank: number, nicknameArray: any) {
    this.rankOfNicknameList = rank;
    this.nicknameList = nicknameArray.join(', ');
    this.smModal.show();
  }
  // Below are the original dashboard functions
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
