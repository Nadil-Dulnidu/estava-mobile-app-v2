import { Router } from "express";
import * as inquiryController from "../controllers/inquiry.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createInquirySchema,
  inquiryIdParamSchema,
  inquiryUserIdParamSchema,
  listInquiriesQuerySchema,
  updateInquirySchema,
  updateInquiryStatusSchema,
} from "../validators/inquiry.validator.js";

const router = Router();

router.use(...authenticate);

router
  .route("/")
  .post(validate(createInquirySchema), inquiryController.createInquiry)
  .get(validate(listInquiriesQuerySchema, "query"), inquiryController.getInquiries);

router.get(
  "/receiver/:id",
  validate(inquiryUserIdParamSchema, "params"),
  validate(listInquiriesQuerySchema, "query"),
  inquiryController.getInquiriesByReceiver
);

router.get(
  "/sender/:id",
  validate(inquiryUserIdParamSchema, "params"),
  validate(listInquiriesQuerySchema, "query"),
  inquiryController.getInquiriesBySender
);

router.patch(
  "/:id/status",
  validate(inquiryIdParamSchema, "params"),
  validate(updateInquiryStatusSchema),
  inquiryController.updateInquiryStatus
);

router
  .route("/:id")
  .get(validate(inquiryIdParamSchema, "params"), inquiryController.getInquiryById)
  .patch(
    validate(inquiryIdParamSchema, "params"),
    validate(updateInquirySchema),
    inquiryController.updateInquiry
  )
  .delete(validate(inquiryIdParamSchema, "params"), inquiryController.deleteInquiry);

export default router;
