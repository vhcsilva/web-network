import {ReactNode} from "react";
import {Col, Form, OverlayTrigger, Popover} from "react-bootstrap";

import InfoIcon from "assets/icons/info-icon";

import InputNumber from "components/input-number";
import {WarningSpan} from "components/warning-span";

interface FormGroupProps {
  label: string;
  value: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string | ReactNode;
  hint?: string | ReactNode;
  description?: string;
  symbol?: string;
  variant?: "input" | "numberFormat";
  onBlur?: () => void;
  onChange?: (newValue: string) => void;
  decimalScale?: number;
}

export function FormGroup({
                            label,
                            onChange,
                            error,
                            hint,
                            variant = "input",
                            symbol,
                            decimalScale,
                            ...rest
                          }: FormGroupProps) {
  const isNumberFormat = variant === "numberFormat";

  function handleChange(e) {
    onChange?.(e.target.value);
  }

  function handleNumberFormatChange({ value }) {
    onChange?.(value);
  }

  function renderDescription(text: string) {
    if (!text) return <></>;
  
    const popover = (
      <Popover id="popover-tabbed-description" className="p-2 bg-white">
        <Popover.Body
          as="p"
          className="p-small-bold m-0 py-0 px-2 text-light-gray"
        >
          {text}
        </Popover.Body>
      </Popover>
    );
  
    return (
      <>
        <OverlayTrigger placement="bottom" overlay={popover}>
          <span className="text-gray-500">
            <InfoIcon width={14} height={14} color="gray-500" />
          </span>
        </OverlayTrigger>
      </>
    );
  }

  return(
    <Col>
      <Form.Group className="form-group my-0">
        <Form.Label 
          className={`caption-medium text-gray-50 text-capitalize 
            font-weight-500 d-flex flex-row align-items-center mb-2`}
        >
          <span className="mr-1 text-truncate">{label}</span>
          {renderDescription(rest?.description)}
        </Form.Label>
        { !isNumberFormat &&
          <Form.Control
            type="text"
            onChange={handleChange}
            className={error && "is-invalid" || ""}
            {...rest}
          /> ||
          <InputNumber
            classSymbol={"blue-200"}
            onValueChange={handleNumberFormatChange}
            allowNegative={false}
            decimalScale={decimalScale}
            error={!!error}
            thousandSeparator
            symbol={symbol}
            {...rest}
          />
        }

        { error &&
          <WarningSpan
          type="danger"
          text={error}
          />
        }

        {hint}
      </Form.Group>
    </Col>
  ); 
}