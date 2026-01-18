import React from "react";

/**
 * AboutTalenvia component used as the About Us page content.
 */

// PUBLIC_INTERFACE
export default function AboutTalenvia() {
  /** Render About Talenvia content. */
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-900">About Talenvia</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Talenvia is a career development and job-search platform designed to help professionals manage their profile,
          prepare effectively, and make informed career decisions.
        </p>

        {/* Mission */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Our Mission</h2>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Our mission is to enable individuals to manage their career journey with confidence by providing reliable
            tools for profile building, job preparation, and application tracking.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900">Profile Management</h3>
            <p className="mt-2 text-sm text-gray-600">
              Build and maintain a complete professional profile including education, skills, projects, and experience.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900">Job Discovery &amp; Preparation</h3>
            <p className="mt-2 text-sm text-gray-600">
              Discover relevant opportunities and prepare with structured practice, assessments, and guided learning.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900">Privacy &amp; Reliability</h3>
            <p className="mt-2 text-sm text-gray-600">
              Designed with a privacy-first approach to ensure data security, transparency, and trust.
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-10 border-t pt-6">
          <p className="text-sm text-gray-500 max-w-3xl">
            Talenvia focuses on clarity, consistency, and long-term growth—helping users take meaningful steps toward
            better career outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}
