import moment from 'moment';
import { db } from '../../../models';

function getDate(from, to) {
  let fromDate = from; let
    toDate = to;
  if (fromDate && toDate) {
    fromDate = new Date(fromDate);
    toDate = new Date(toDate);
  } else {
    fromDate = new Date();
    toDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
  }

  fromDate = moment.utc(fromDate).toDate();
  toDate = moment.utc(toDate).toDate();

  return [fromDate, toDate];
}
export default {
  async index(req, res, next) {
    const {
      projectName, clientName, skillsRequired, location
    } = req.body;
    const date = getDate(req.query.fromDate, req.query.toDate);
    const where = { startDate: { $gte: date[0], $lte: date[1] } };
    if (projectName && projectName.length) where.projectName = { like: `%${projectName}%` };
    if (clientName && clientName.length) where.clientName = { like: `%${clientName}%` };
    if (skillsRequired && skillsRequired.length) where.skillsRequired = { like: `%${skillsRequired}%` };
    if (location && location.length) where.location = { like: `%${location}%` };
    const { limit, page } = req.query;
    const mypage = Number(page) || 1;
    const mylimit = Number(limit) || 10;
    console.log(where);
    db.project.count({
      logging: console.log,
      where
    })
      .then((count) => {
        const pages = Math.ceil(count / mylimit);
        const offset = mylimit * (mypage - 1);
        return db.project.findAll({
          logging: console.log,
          where,
          limit: mylimit,
          offset,
          order: [['createdAt', 'DESC']]
        }).then(r => [{
          page: mypage, totalPages: pages, totalCount: count, count: r.length, data: r,
        }]);
      })
      .then(([r]) => {
        res.status(200).json(r);
      }).catch((e) => {
        next(e);
      });
  },

  async project(req, res, next) {
    const { projectId } = req.params;
    db.project.findOne({
      where: { id: projectId }
    }).then(project => project.update(
      req.body
    ))
      .then(r => res.status(200).json({ data: r }))
      .catch(e => next(e));
  }
};
