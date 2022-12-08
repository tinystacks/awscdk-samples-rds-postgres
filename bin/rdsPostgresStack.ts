import { constructId } from '@tinystacks/iac-utils';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cdk from 'aws-cdk-lib';
import {
  VPC,
  Rds,
  SecurityGroups,
} from '@tinystacks/aws-cdk-constructs';

export class RdsPostgresStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, stackProps?: cdk.StackProps, importedVpcId?: string) {
        super(scope, id, stackProps);
        let vpc: ec2.IVpc;


        if (!importedVpcId) {
          // Create VPC
          const vpcConstruct = new VPC(this, constructId(id + '-rds-vpc'), {
            internetAccess: false,
          });
          vpc = vpcConstruct.vpc;
        } else {
          vpc = ec2.Vpc.fromLookup(this, constructId(id + '-rds-vpc'), {
            vpcId: importedVpcId
          });
        }
        
        
        // Create Security Group
        const sgRules = [
          { name: 'SSH', port: ec2.Port.tcp(22), peer: ec2.Peer.anyIpv4() },
          { name: 'HTTP', port: ec2.Port.tcp(80), peer: ec2.Peer.anyIpv4() },
          { name: 'HTTPS', port: ec2.Port.tcp(443), peer: ec2.Peer.anyIpv4() },
          { name: 'Postgres', port: ec2.Port.tcp(5432), peer: ec2.Peer.anyIpv4() },
        ]

        const commonSecurityGroup = new SecurityGroups(this, constructId(id + 'rds-vpc-sgs'), {
          vpc,
          securityGroupName: 'common',
          securityGroupRulesList: sgRules
        });

        // Create RDS Postgres

        new Rds(this, constructId(id + 'rds-postgres'), {
          instanceIdentifier: id + '-rds-postgres',
          vpc,
          databaseEngine: rds.DatabaseInstanceEngine.POSTGRES,
          securityGroupsList: [commonSecurityGroup.securityGroup],
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3,
            ec2.InstanceSize.MICRO,
          ),
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        });
    }
}