import { Router } from "express";
import dataRoute from "./data";
import structureRoute from "./structure";
import actionsRoute from "./actions";

export default (router: Router) => {
  dataRoute(router);
  structureRoute(router);
  actionsRoute(router);
};
