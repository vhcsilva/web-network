import { ParsedUrlQuery } from "querystring";
import { Sequelize } from "sequelize";
import { HttpNotFoundError } from "server/errors/http-errors";

import models from "db/models";

import { caseInsensitiveEqual } from "helpers/db/conditionals";
import { getAssociation } from "helpers/db/models";

export default async function get(query: ParsedUrlQuery) {
  const {
    proposalId,
    issueId,
    network,
    chain,
  } = query;

  if (!proposalId || !issueId || !network || !chain)
    throw new HttpNotFoundError("Missing parameters");

  const proposal = await models.mergeProposal.findOne({
    where: {
      id: proposalId
    },
    include: [
      getAssociation("disputes"),
      getAssociation("distributions", ["recipient", "percentage"], true, undefined, [
        getAssociation( "user",
                        ["githubLogin"],
                        false,
                        undefined,
                        undefined, 
                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("distributions.user.address")),
                                        "=",
                                        Sequelize.fn("lower", Sequelize.col("distributions.recipient"))))
      ]),
      getAssociation("pullRequest"),
      getAssociation("issue", undefined, true, { issueId: issueId }, [
        getAssociation("repository", ["githubPath"]),
        getAssociation("transactionalToken", ["name", "symbol"]),
      ]),
      getAssociation("network", [], true, {
        name: caseInsensitiveEqual("network.name", network?.toString())
      }, [
        getAssociation("chain", [], true, {
          chainShortName: caseInsensitiveEqual("network.chain.chainShortName", chain?.toString())
        })
      ]),
    ]
  });

  if (!proposal)
    throw new HttpNotFoundError("Proposal not found");

  return proposal;
}