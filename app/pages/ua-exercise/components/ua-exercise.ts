import {Component, OnInit} from '@angular/core';
import {DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';
declare var jQuery: any;
import {Dragula, DragulaService} from 'ng2-dragula/ng2-dragula';

@Component({
	moduleId: module.id,
	selector: 'ua-exercise',
	templateUrl: 'ua-exercise.html',
  directives: [[DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, ROUTER_DIRECTIVES, AlertComponent, Dragula]],
  viewProviders: [DragulaService]
})

export class ExerciseComponent implements OnInit {
  alerts: Array<Object> = [];
  curr: RouteSegment;
  exercise: any;
  otherExercises: any;
  reposition: boolean = true;
  dateNow: Date = new Date();
  dateStart: Date = null;
  dateEnd: Date = null;
  showNumbers: boolean = false;
  dragging: boolean = false;
  diseaseDB: string = 'ordo';
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    this.curr = curr;
    let finishGetExercise = function(data: any) {
      scope.exercise = data;
      if (scope.exercise.dateStart)
        scope.dateStart = new Date(scope.exercise.dateStart);
      scope.exercise.dateStart = scope.dateStart;
      if (scope.exercise.dateEnd)
        scope.dateEnd = new Date(scope.exercise.dateEnd);
      scope.exercise.dateEnd = scope.dateEnd;
      if (scope.dateStart && scope.dateStart <= scope.dateNow)
        scope.showNumbers = true;
      for (let i = 0; i < scope.exercise.submissions.length; i++)
        scope.exercise.submissions[i].dateSubmittedFormatted = new Date(scope.exercise.submissions[i].dateSubmitted);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(curr.getParam('id'))
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetExercise(data),
        err => this._router.navigate(['/dashboard', '/home']),
        () => console.log('Got exercise')
      );
    // Get other exercises
    let finishGetOtherExercises = function(data: any) {
      scope.otherExercises = data.otherExercises;
    };
    this._http.post(globals.backendURL + '/restricted/exercise/prof/other-exercises', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetOtherExercises(data),
        err => console.log(err),
        () => console.log('Got other exercises')
      );
  }
  ngOnInit():any {
    let scope = this;
    jQuery('.js-typeahead').typeahead({
      dynamic: true,
      cancelButton: false,
      filter: false,
      source: {
        diseases: {
          ajax: {
            url: globals.backendURL + '/solr/ordo/{{query}}',
            path: 'matches'
          }
        }
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          scope.addProblem(item.display, 'ordo');
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
            url: globals.backendURL + '/solr/omim/{{query}}',
            path: 'matches'
          }
        }
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          scope.addProblem(item.display, 'omim');
        }
      }
    });
    jQuery(document).on('mousemove', function(e: any){
      jQuery('.hover-box').css({
        left:   e.clientX - 320,
        bottom: window.innerHeight - e.clientY
      });
      if (scope.dragging) {
        let mousePosition = e.pageY - jQuery(document).scrollTop();
        let topRegion = 50;
        let bottomRegion = window.innerHeight - 50;
        if (mousePosition < topRegion || mousePosition > bottomRegion) {    // e.wich = 1 => click down !
          let distance = e.clientY - window.innerHeight / 2;
          console.log(distance);
          distance = distance * 0.1; // <- velocity
          jQuery(document).scrollTop(distance + jQuery(document).scrollTop());
        }
      }
    });
  }
  addProblem(diseaseName: string, diseaseDB: string) {
    let scope = this;
    let finishAddProblem = function(data: any) {
      scope.exercise.problems.push(data);
      jQuery('.js-typeahead').val('');
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(this.exercise.exerciseID),
      'diseaseName': diseaseName,
      'vocabulary': diseaseDB
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/add', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishAddProblem(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Cannot add disease. Has it already been added?',
          closable: true
        }),
        () => console.log('Added problem')
      );
  }
  constructor( private _router: Router, private _http: Http, private dragulaService: DragulaService ) {
    let scope = this;
    dragulaService.setOptions('problems', {
      accepts: function (el: any, target: any, source: any, sibling: any) {
        return true;
      },
      invalid: function (el: any, handle: any) {
        return !(scope.reposition && (!scope.dateStart || scope.dateStart > scope.dateNow));
      }
    });
    dragulaService.drag.subscribe((value: any) => {
      jQuery('.problem').css('cursor', 'grabbing');
      jQuery('.hover-box').show();
      this.dragging = true;
    });
    dragulaService.dragend.subscribe((value: any) => {
      this.dragging = false;
      jQuery('.hover-box').hide();
    });
    dragulaService.cancel.subscribe((value: any) => {
      jQuery('.problem').css('cursor', 'grab');
    });
    dragulaService.drop.subscribe((value: any) => {
      let finishRepositionProblem = function(data: any) {
        scope.reposition = true;
        jQuery('.problem').css('cursor', 'grab');
      };
      this.reposition = false;
      //jQuery('.problem').css('cursor', 'wait');
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'exerciseID': parseInt(this.exercise.exerciseID),
        'problemID': value[1].id.match(/\d+/)[0],
        'afterProblemID': (value[4]) ? value[4].id.match(/\d+/)[0] : null
      });
      this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/reposition', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishRepositionProblem(data),
          err => console.log(err),
          () => console.log('Repositioned problem')
        );
    });
  }
  deleteExercise() {
    let scope = this;
    let finishDeleteExercise = function(data: any) {
      scope._router.navigate(['/dashboard', '/class-prof', scope.exercise.classID]);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(this.exercise.exerciseID)
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/delete', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishDeleteExercise(data),
        err => console.log(err),
        () => console.log('Deleted exercise')
      );
  }
  renameExercise() {
    let scope = this;
    let newExerciseName = prompt('Rename exercise to:');
    if (!newExerciseName)
      return;
    let finishRenameExercise = function(data: any) {
      scope.exercise.exerciseName = newExerciseName;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': parseInt(this.exercise.exerciseID),
      'newExerciseName': newExerciseName
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/rename', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRenameExercise(data),
        err => console.log(err),
        () => console.log('Renamed exercise')
      );
  }
  gotoPhenository(diseaseDB: string, diseaseName: string) {
    localStorage.setItem('uaPhenositoryDisease', diseaseName);
    localStorage.setItem('uaPhenositoryDiseaseDB', diseaseDB);
    this._router.navigate(['/dashboard', '/phenository']);
  }
  lookUpDisease(diseaseDB: string, diseaseName: string) {
    if (diseaseDB === 'omim') {
      window.open(globals.omimURL + diseaseName.substr(0, diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    } else if (diseaseDB === 'ordo') {
      window.open(globals.ordoURL + diseaseName.substr(0, diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    }
  }
  removeProblem(problemID: number) {
    let scope = this;
    let finishRemoveProblem = function(data: any) {
      for (let i = 0; i < scope.exercise.problems.length; i++) {
        if (scope.exercise.problems[i].problemID === problemID)
          scope.exercise.problems.splice(i, 1);
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID,
      'problemID': problemID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/problem/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemoveProblem(data),
        err => console.log(err),
        () => console.log('Removed problem')
      );
  }
  copyProblems(exerciseID: number) {
    if (!confirm('The existing diseases in the target exercise will be deleted. This cannot be undone'))
      return;
    let scope = this;
    let finishCopyProblems = function(data: any) {
      scope._router.navigate(['/dashboard', '/exercise', exerciseID]);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID,
      'toExerciseID': exerciseID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/copy-problems', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishCopyProblems(data),
        err => console.log(err),
        () => console.log('Copied problems')
      );
  }
  startDate() {
    let scope = this;
    let finishStartDate = function(data: any) {
      if (data.date)
        scope.dateStart = new Date(data.date);
      scope.exercise.dateStart = scope.dateStart;
      if (data.changed) {
        scope.alerts.push({
          type: 'success',
          msg: 'Start date updated',
          closable: true
        });
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Start date has not been updated.',
          closable: true
        });
      }
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID,
      'date': this.exercise.dateStart
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/start-date', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishStartDate(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Please enter a valid date and time; they cannot be in the past or after the end date or time.',
          closable: true
        }),
        () => console.log('Updated start date')
      );
  }
  startNow() {
    let scope = this;
    let finishStartNow = function(data: any) {
      if (data.date)
        scope.dateStart = new Date(data.date);
      scope.exercise.dateStart = scope.dateStart;
      scope.dateNow = new Date();
      scope.dateNow.setDate(scope.dateNow.getDate() + 1);
      scope.alerts.push({
        type: 'success',
        msg: 'Start date updated',
        closable: true
      });
      jQuery('.js-typeahead').prop('disabled', true);
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/start-now', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishStartNow(data),
        err => console.log(err),
        () => console.log('Start now')
      );
  }
  endDate() {
    let scope = this;
    let finishEndDate = function(data: any) {
      if (data.date)
        scope.dateEnd = new Date(data.date);
      scope.exercise.dateEnd = scope.dateEnd;
      if (data.changed) {
        scope.alerts.push({
          type: 'success',
          msg: 'End date updated',
          closable: true
        });
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'End date has not been updated.',
          closable: true
        });
      }
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID,
      'date': this.exercise.dateEnd
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/end-date', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishEndDate(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Please enter a valid date and time; they cannot be in the past or before the start date and time.',
          closable: true
        }),
        () => console.log('Updated end date')
      );
  }
  endNow() {
    let scope = this;
    let finishEndNow = function (data:any) {
      if (data.date)
        scope.dateEnd = new Date(data.date);
      scope.exercise.dateEnd = scope.dateEnd;
      scope.dateNow = new Date();
      scope.dateNow.setDate(scope.dateNow.getDate() + 1);
      scope.alerts.push({
        type: 'success',
        msg: 'End date updated',
        closable: true
      });
    };
    this.alerts = [];
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/end-now', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishEndNow(data),
        err => console.log(err),
        () => console.log('End now')
      );
  }
  createAnnotation(diseaseName: string, diseaseDB:string) {
    let scope = this;
    this.alerts = [];
    let finishCreateAnnotation = function (data:any) {
      if (data.success) {
        scope._router.navigate(['/dashboard', '/in-progress', data.annotationID]);
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Invalid disease',
          closable: true
        });
      }
    };
    // Create new annotation
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'diseaseName': diseaseName,
      'vocabulary': diseaseDB //ORPHA TODO
    });
    this._http.post(globals.backendURL + '/restricted/annotations/prof/new-annotation', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishCreateAnnotation(data),
        err => console.log(err),
        () => console.log('Created annotation')
      );
  }
  gotoComparator(annotationID: number) {
    localStorage.setItem('uaAnnotation', '' + annotationID);
    localStorage.removeItem('uaCompareTo');
    this._router.navigate(['/dashboard', '/comparator']);
  }
  selectAll() {
    let checkboxes: any = document.getElementsByName('release');
    let select = false;
    for (var i = 0; i < checkboxes.length; i++) {
      if (!checkboxes[i].checked) {
        select = true;
        break;
      }
    }
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = select;
    }
  }
  releaseAll(release: boolean) {
    let checkboxes: any = document.getElementsByName('release');
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        for (let j = 0; j < this.exercise.submissions.length; j++) {
          if (this.exercise.submissions[i].annotationID.toString() === checkboxes[i].value) {
            if (release) {
              this.exercise.submissions[i].numReleased = this.exercise.submissions[i].numAnnotations;
            } else {
              this.exercise.submissions[i].numReleased = 0;
            }
          }
        }
        let body = JSON.stringify({
          'token': localStorage.getItem('uaToken'),
          'annotationID': checkboxes[i].value,
          'release': release
        });
        this._http.post(globals.backendURL + '/restricted/annotation/prof/score/release/all', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => console.log(data),
            err => console.log(err),
            () => console.log('Created annotation')
          );
      }
    }
  }
  setDB(db:string) {
    this.diseaseDB = db;
    if (this.diseaseDB === 'ordo') {
      jQuery('#omim-form').hide();
      jQuery('#ordo-form').show();
    }
    if (this.diseaseDB === 'omim') {
      jQuery('#omim-form').show();
      jQuery('#ordo-form').hide();
    }
  }
  sortSubmissions(mode: number) {
    let scope = this;
    let finishSortSubmissions = function(data: any) {
      scope.exercise = data;
      for (let i = 0; i < scope.exercise.submissions.length; i++)
        scope.exercise.submissions[i].dateSubmittedFormatted = new Date(scope.exercise.submissions[i].dateSubmitted);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'exerciseID': this.exercise.exerciseID,
      'sortMode': mode
    });
    this._http.post(globals.backendURL + '/restricted/exercise/prof/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSortSubmissions(data),
        err => console.log(err),
        () => console.log('Sorted submissions')
      );
  }
}
