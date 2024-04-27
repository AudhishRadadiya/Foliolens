import React, { useState } from "react";
import { Col } from "react-bootstrap";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button className={className} style={{ ...style, display: "block" }} onClick={onClick}>
      <FontAwesomeIcon icon={faAngleRight} style={{ fontSize: "20px" }} />
    </button>
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button className={className} style={{ ...style, display: "block" }} onClick={onClick}>
      <FontAwesomeIcon icon={faAngleLeft} style={{ fontSize: "20px" }} />
    </button>
  );
}

export default function PropertyImages({ propertyImages }) {
  const [image, setImage] = useState("");
  const customeSlider = React.createRef();

  const settings = {
    rows: 2,
    slidesPerRow: 1,
    infinite: false,
    speed: 400,
    slidesToShow: propertyImages?.length > 2 ? 2 : 1,
    slidesToScroll: 1,
    initialSlide: 0,
    autoplaySpeed: 5000,
    centerPadding: "0",
    arrows: true,
    nextArrow: (propertyImages?.length > 2 || (window.screen.width < 600 && propertyImages?.length > 2)) && (
      <SampleNextArrow />
    ),
    prevArrow: (propertyImages?.length > 2 || (window.screen.width < 600 && propertyImages?.length > 2)) && (
      <SamplePrevArrow />
    ),
    responsive: [
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="row">
      <Col className="col-6 property-carousel">
        <div className={propertyImages?.length > 0 && "property-main-image"}>
          <img src={image ? image : propertyImages && propertyImages[0]} alt="" className="property-main-img" />
        </div>
      </Col>
      <Col className="col-6">
        <div>
          <button className="arrow-btn">
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>
          <div className="properties-slider">
            <Slider {...settings} ref={customeSlider}>
              {propertyImages?.map((item, i) => (
                <div key={i} className="slider-sub-images">
                  <img
                    src={item}
                    alt=""
                    className={`slider-img ${propertyImages?.length < 3 && "responsive-img"}`}
                    onClick={() => setImage(item)}
                  />
                </div>
              ))}
            </Slider>
          </div>
          <button className="arrow-btn">
            <FontAwesomeIcon icon={faAngleRight} />
          </button>
        </div>
      </Col>
    </div>
  );
}
