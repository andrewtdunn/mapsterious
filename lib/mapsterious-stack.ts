import * as cdk from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const GITHUB_ACCT = "andrewtdunn";
const GITHUB_REPO = "mapsterious";
const GITHUB_BRANCH = "main";

const connectionArn =
  "arn:aws:codeconnections:us-east-1:637423577773:connection/cb4dc86f-4341-4834-a59b-049f0e496d07";

export class MapsteriousStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      synth: new cdk.pipelines.CodeBuildStep("Synth", {
        input: CodePipelineSource.connection(
          `${GITHUB_ACCT}/${GITHUB_REPO}`,
          GITHUB_BRANCH,
          {
            connectionArn,
          }
        ),
        installCommands: ["npm install -g npm@latest"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
      crossAccountKeys: true,
    });
  }
}
