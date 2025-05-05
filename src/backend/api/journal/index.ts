import { Router } from "express";
import dataRoute from "./data";
import structureRoute from "./structure";

export default (router: Router) => {
  dataRoute(router);
  structureRoute(router);
};
