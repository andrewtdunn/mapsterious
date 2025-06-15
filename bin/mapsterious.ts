#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MapsteriousStack } from "../lib/mapsterious-stack";

const app = new cdk.App();
new MapsteriousStack(app, "MapsteriousStack", {
  env: {
    account: "637423577773", // shared-services
    region: "us-east-1",
  },
});
