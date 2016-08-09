import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES} from '@angular/router';
import {DROPDOWN_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
	moduleId: module.id,
	selector: 'ua-comparator',
	templateUrl: 'ua-comparator.html',
  directives: [[ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES, AlertComponent]]
})

export class ComparatorComponent {
  alerts: Array<Object>;
  comparison: any = null;
  systemNames: Array<Object> = [];
  studentLevel: boolean = false;
  profLevel: boolean = false;
  constructor( private _router: Router, private _http: Http) {
    let scope = this;
    if (localStorage.getItem('uaAnnotation') === null) {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: 'You don\'t have any annotations open.',
        closable: true
      });
      return;
    }
    this.gotoComparison(localStorage.getItem('uaAnnotation'), localStorage.getItem('uaCompareTo'));
    let gotLevel = function (data: any) {
      if (data.level === 0) {
        scope.studentLevel = true;
        scope.profLevel = false;
      } else {
        scope.studentLevel = false;
        scope.profLevel = true;
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotLevel(data),
        err => console.log(err),
        () => console.log('Got level')
      );
  }
  gotoComparison(annotationID, compareToAnnotationID) {
    let scope = this;
    this.alerts = [];
    let loadedName = function(datum: any) {
      for (let s = 0; s < scope.comparison.systems.length; s++) {
        for (let i = 0; i < scope.comparison.systems[s].phenotypes.length; i++) {
          if (scope.comparison.systems[s].phenotypes[i].hpo === datum.id) {
            scope.comparison.systems[s].phenotypes[i].phenotypeName = datum.name;
            scope.comparison.systems[s].phenotypes[i].phenotypeDefinition = datum.def;
          }
        }
        for (let i = 0; i < scope.comparison.systems[s].compareToPhenotypes.length; i++) {
          if (scope.comparison.systems[s].compareToPhenotypes[i].hpo === datum.id) {
            scope.comparison.systems[s].compareToPhenotypes[i].phenotypeName = datum.name;
            scope.comparison.systems[s].compareToPhenotypes[i].phenotypeDefinition = datum.def;
          }
        }
      }
    };
    let initializeComparison = function (data:any) {
      scope.comparison = data;
      localStorage.setItem('uaCompareTo', '' + data.compareToAnnotationID);
      let usedPhenotypes: Array<string> = [];
      for (let s = 0; s < data.systems.length; s++) {
        for (let i = 0; i < data.systems[s].phenotypes.length; i++) {
          if (usedPhenotypes.indexOf(data.systems[s].phenotypes[i].hpo) !== -1)
            continue;
          usedPhenotypes.push(data.systems[s].phenotypes[i].hpo);
          let body = JSON.stringify({
            'phenotypeName': data.systems[s].phenotypes[i].hpo
          });
          scope._http.post(globals.backendURL + '/definition', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedName(data),
              err => console.log(err),
              () => console.log('Got name')
            );
        }
        for (let i = 0; i < data.systems[s].compareToPhenotypes.length; i++) {
          if (usedPhenotypes.indexOf(data.systems[s].compareToPhenotypes[i].hpo) !== -1)
            continue;
          usedPhenotypes.push(data.systems[s].compareToPhenotypes[i].hpo);
          let body = JSON.stringify({
            'phenotypeName': data.systems[s].compareToPhenotypes[i].hpo
          });
          scope._http.post(globals.backendURL + '/definition', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedName(data),
              err => console.log(err),
              () => console.log('Got name')
            );
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': localStorage.getItem('uaAnnotation'),
      'compareToAnnotationID': localStorage.getItem('uaCompareTo')
    });
    this._http.post(globals.backendURL + '/restricted/annotation/compare', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => initializeComparison(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Invalid annotation',
          closable: true
        }),
        () => console.log('Got full comparison')
      );
  }
  goToAnnotator() {
    this._router.navigate(['/dashboard', '/in-progress', this.comparison.annotationID]);
  }
  goToAnnotatorCompareTo() {
    this._router.navigate(['/dashboard', '/in-progress', this.comparison.compareToAnnotationID]);
  }
  onsetAbbreviation(hpo: string) {
    switch (hpo) {
      case 'HP:0030674':
        return 'ANT';
      case 'HP:0003577':
        return 'CON';
      case 'HP:0003623':
        return 'NEO';
      case 'HP:0003593':
        return 'INF';
      case 'HP:0011463':
        return 'CHI';
      case 'HP:0003621':
        return 'JUV';
      case 'HP:0003581':
        return 'ADU';
      default:
        return '–––';
    }
  }
  onsetDescription(hpo: string) {
    switch (hpo) {
      case 'HP:0030674':
        return 'Antenatal (before birth)';
      case 'HP:0003577':
        return 'Congenital (at birth)';
      case 'HP:0003623':
        return 'Neonatal (0 to 28 days)';
      case 'HP:0003593':
        return 'Infantile (28 days to 1 year)';
      case 'HP:0011463':
        return 'Childhood (1 to 5 years)';
      case 'HP:0003621':
        return 'Juvenile (5 to 15 years)';
      case 'HP:0003581':
        return 'Adult (16 years or later)';
      default:
        return 'Not sure';
    }
  }
  frequencyDescription(frequency: number) {
    switch (frequency) {
      case -1:
        return 'Not sure';
      case 0:
        return 'Variable (prob. 30% to 70%)';
      case 0.01:
        return 'Very rare (1%)';
      case 0.05:
        return 'Rare (5%)';
      case 0.075:
        return 'Occasional (7.5%)';
      case 0.33:
        return 'Frequent (33%)';
      case 0.5:
        return 'Typical (50%)';
      case 0.75:
        return 'Common (75%)';
      case 0.9:
        return 'Hallmark (90%)';
      case 1:
        return 'Obligate (100%)';
      default:
        return 'Not sure';
    }
  }
}
